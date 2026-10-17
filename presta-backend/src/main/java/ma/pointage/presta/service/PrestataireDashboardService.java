package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.pointage.presta.dto.response.PrestataireDashboardStatsResponse;
import ma.pointage.presta.dto.response.PrestataireDashboardStatsResponse.DailyPointageStatDto;
import ma.pointage.presta.dto.response.PrestataireDashboardStatsResponse.RecentPointageDto;
import ma.pointage.presta.dto.response.PrestataireDashboardStatsResponse.RecentTaskDto;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.model.AffectationTache;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.enums.StatutPointage;
import ma.pointage.presta.model.enums.StatutTache;
import ma.pointage.presta.repository.AffectationTacheRepository;
import ma.pointage.presta.repository.PointageRepository;
import ma.pointage.presta.repository.PrestataireRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PrestataireDashboardService {

    private final PrestataireRepository prestataireRepository;
    private final PointageRepository pointageRepository;
    private final AffectationTacheRepository affectationTacheRepository;

    private Prestataire getPrestataireConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return prestataireRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire introuvable avec l'email : " + email));
    }

    public PrestataireDashboardStatsResponse getDashboardStats() {
        Prestataire prestataire = getPrestataireConnecte();
        Long prestataireId = prestataire.getId();

        // 1. Récupération de tous les pointages et affectations du prestataire
        List<Pointage> pointages = pointageRepository.findByPrestataireId(prestataireId);
        List<AffectationTache> affectations = affectationTacheRepository.findByPrestataireId(prestataireId);

        // 2. Calcul des KPI Pointages
        YearMonth currentYearMonth = YearMonth.now();
        long pointagesMois = pointages.stream()
                .filter(p -> p.getDate() != null && YearMonth.from(p.getDate()).equals(currentYearMonth))
                .count();

        long pointagesEnAttente = pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.EN_ATTENTE)
                .count();

        long pointagesValides = pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.VALIDE)
                .count();

        long pointagesRejetes = pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.REJETE)
                .count();

        // 3. Calcul des compteurs Tâches
        long tachesNonDemarrees = affectations.stream()
                .filter(a -> a.getStatut() == StatutTache.NON_DEMARREE)
                .count();

        long tachesEnCours = affectations.stream()
                .filter(a -> a.getStatut() == StatutTache.EN_COURS)
                .count();

        long tachesTerminees = affectations.stream()
                .filter(a -> a.getStatut() == StatutTache.TERMINEE)
                .count();

        // 4. Évolution quotidienne (30 derniers jours)
        LocalDate today = LocalDate.now();
        DateTimeFormatter shortDayFormatter = DateTimeFormatter.ofPattern("dd/MM");
        List<DailyPointageStatDto> dailyStats = new ArrayList<>();

        for (int i = 29; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            List<Pointage> dayPointages = pointages.stream()
                    .filter(p -> p.getDate() != null && p.getDate().equals(day))
                    .toList();

            long valides = dayPointages.stream().filter(p -> p.getStatut() == StatutPointage.VALIDE).count();
            long enAttente = dayPointages.stream().filter(p -> p.getStatut() == StatutPointage.EN_ATTENTE).count();
            long rejetes = dayPointages.stream().filter(p -> p.getStatut() == StatutPointage.REJETE).count();
            long total = dayPointages.size();

            dailyStats.add(DailyPointageStatDto.builder()
                    .date(day.format(shortDayFormatter))
                    .fullDate(day.toString())
                    .total(total)
                    .valides(valides)
                    .enAttente(enAttente)
                    .rejetes(rejetes)
                    .build());
        }

        // 5. Dernières Activités
        // Dernier pointage soumis (Statut EN_ATTENTE ou plus récent pointage)
        RecentPointageDto dernierPointageSoumis = pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.EN_ATTENTE)
                .max(Comparator.comparing(p -> p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt()))
                .or(() -> pointages.stream().max(Comparator.comparing(p -> p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt())))
                .map(this::toRecentPointageDto)
                .orElse(null);

        // Dernier pointage traité (VALIDE ou REJETE)
        RecentPointageDto dernierPointageTraite = pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.VALIDE || p.getStatut() == StatutPointage.REJETE)
                .max(Comparator.comparing(p -> p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt()))
                .map(this::toRecentPointageDto)
                .orElse(null);

        // Dernière tâche affectée
        RecentTaskDto derniereTacheAffectee = affectations.stream()
                .max(Comparator.comparing(a -> a.getDateAffectation() != null ? a.getDateAffectation() : a.getCreatedAt()))
                .map(this::toRecentTaskDto)
                .orElse(null);

        return PrestataireDashboardStatsResponse.builder()
                .pointagesMois(pointagesMois)
                .pointagesEnAttente(pointagesEnAttente)
                .pointagesValides(pointagesValides)
                .pointagesRejetes(pointagesRejetes)
                .dailyStats(dailyStats)
                .tachesNonDemarrees(tachesNonDemarrees)
                .tachesEnCours(tachesEnCours)
                .tachesTerminees(tachesTerminees)
                .dernierPointageSoumis(dernierPointageSoumis)
                .dernierPointageTraite(dernierPointageTraite)
                .derniereTacheAffectee(derniereTacheAffectee)
                .build();
    }

    private RecentPointageDto toRecentPointageDto(Pointage pointage) {
        String nomFichier = pointage.getImagePointage() != null ? pointage.getImagePointage().getNomOriginal() : null;
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String datePointageStr = pointage.getDate() != null ? pointage.getDate().format(dtf) : "-";

        return RecentPointageDto.builder()
                .id(pointage.getId())
                .datePointage(datePointageStr)
                .statut(pointage.getStatut().name())
                .nomFichier(nomFichier)
                .motifRejet(pointage.getMotifRejet())
                .dateAction(pointage.getUpdatedAt() != null ? pointage.getUpdatedAt() : pointage.getCreatedAt())
                .build();
    }

    private RecentTaskDto toRecentTaskDto(AffectationTache affectation) {
        String nomTache = affectation.getTache() != null ? affectation.getTache().getNom() : "Tâche inconnue";
        String categorie = (affectation.getTache() != null && affectation.getTache().getCategorie() != null)
                ? affectation.getTache().getCategorie().name() : null;

        return RecentTaskDto.builder()
                .affectationId(affectation.getId())
                .nomTache(nomTache)
                .categorie(categorie)
                .statut(affectation.getStatut().name())
                .dateAffectation(affectation.getDateAffectation())
                .build();
    }
}
