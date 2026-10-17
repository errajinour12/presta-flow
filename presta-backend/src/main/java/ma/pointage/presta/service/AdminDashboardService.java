package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.response.AdminDashboardStatsResponse;
import ma.pointage.presta.dto.response.AdminDashboardStatsResponse.LatestSubmissionDto;
import ma.pointage.presta.dto.response.AdminDashboardStatsResponse.MonthlyPointageStatDto;
import ma.pointage.presta.dto.response.AdminDashboardStatsResponse.RecentActivityDto;
import ma.pointage.presta.model.ImagePointage;
import ma.pointage.presta.model.Pointage;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.Tache;
import ma.pointage.presta.model.enums.StatutPointage;
import ma.pointage.presta.model.enums.StatutTache;
import ma.pointage.presta.repository.ImagePointageRepository;
import ma.pointage.presta.repository.PointageRepository;
import ma.pointage.presta.repository.PrestataireRepository;
import ma.pointage.presta.repository.TacheRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final PrestataireRepository prestataireRepository;
    private final TacheRepository tacheRepository;
    private final PointageRepository pointageRepository;
    private final ImagePointageRepository imagePointageRepository;

    public AdminDashboardStatsResponse getDashboardStats() {
        // 1. Prestataires
        List<Prestataire> prestataires = prestataireRepository.findAll();
        long totalPrestataires = prestataires.size();
        long prestatairesActifs = prestataires.stream().filter(Prestataire::isActif).count();

        // 2. Tâches (statut basé sur les affectations, car StatutTache est porté par AffectationTache)
        List<Tache> taches = tacheRepository.findAll();
        long totalTaches = taches.size();

        long tachesEnCours = taches.stream()
                .filter(t -> t.getAffectations().stream()
                        .anyMatch(a -> a.getStatut() == StatutTache.EN_COURS))
                .count();

        long tachesNonDemarrees = taches.stream()
                .filter(t -> t.getAffectations().isEmpty()
                        || t.getAffectations().stream()
                        .allMatch(a -> a.getStatut() == StatutTache.NON_DEMARREE))
                .count();

        LocalDate today = LocalDate.now();
        long tachesTermineesAujourdhui = taches.stream()
                .filter(t -> t.getAffectations().stream()
                        .anyMatch(a -> a.getStatut() == StatutTache.TERMINEE
                                && a.getUpdatedAt() != null
                                && a.getUpdatedAt().toLocalDate().equals(today)))
                .count();
        // 3. Pointages
        List<Pointage> pointages = pointageRepository.findAll();
        long totalPointages = pointages.size();

        YearMonth currentYearMonth = YearMonth.now();
        long pointagesMois = pointages.stream()
                .filter(p -> p.getDate() != null && YearMonth.from(p.getDate()).equals(currentYearMonth))
                .count();

        long pointagesEnAttente = pointages.stream().filter(p -> p.getStatut() == StatutPointage.EN_ATTENTE).count();
        long pointagesValides = pointages.stream().filter(p -> p.getStatut() == StatutPointage.VALIDE).count();

        long pointagesValidesMois = pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.VALIDE)
                .filter(p -> p.getDate() != null && YearMonth.from(p.getDate()).equals(currentYearMonth))
                .count();

        long pointagesRejetes = pointages.stream().filter(p -> p.getStatut() == StatutPointage.REJETE).count();
        long pointagesExtraits = pointages.stream().filter(p -> p.getStatut() == StatutPointage.EXTRAIT).count();

        // 4. Monthly Grouped Bar Chart (Last 6 Months)
        List<MonthlyPointageStatDto> monthlyStats = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = currentYearMonth.minusMonths(i);
            String monthName = ym.getMonth().getDisplayName(TextStyle.FULL, Locale.FRENCH);
            monthName = monthName.substring(0, 1).toUpperCase() + monthName.substring(1);

            long validesCount = pointages.stream()
                    .filter(p -> p.getStatut() == StatutPointage.VALIDE)
                    .filter(p -> p.getDate() != null && YearMonth.from(p.getDate()).equals(ym))
                    .count();

            long rejetesCount = pointages.stream()
                    .filter(p -> p.getStatut() == StatutPointage.REJETE)
                    .filter(p -> p.getDate() != null && YearMonth.from(p.getDate()).equals(ym))
                    .count();

            long enAttenteCount = pointages.stream()
                    .filter(p -> p.getStatut() == StatutPointage.EN_ATTENTE)
                    .filter(p -> p.getDate() != null && YearMonth.from(p.getDate()).equals(ym))
                    .count();

            monthlyStats.add(MonthlyPointageStatDto.builder()
                    .monthName(monthName)
                    .valides(validesCount)
                    .rejetes(rejetesCount)
                    .enAttente(enAttenteCount)
                    .build());
        }

        // 5. Statut Breakdown & Percentages for Donut
        Map<String, Long> pointagesParStatut = new LinkedHashMap<>();
        pointagesParStatut.put("VALIDE", pointagesValides);
        pointagesParStatut.put("REJETE", pointagesRejetes);
        pointagesParStatut.put("EN_ATTENTE", pointagesEnAttente);
        pointagesParStatut.put("EXTRAIT", pointagesExtraits);

        Map<String, Double> pointagesStatutPourcentages = new LinkedHashMap<>();
        double safeTotal = totalPointages > 0 ? (double) totalPointages : 1.0;
        pointagesStatutPourcentages.put("VALIDE", Math.round((pointagesValides / safeTotal) * 100.0 * 10.0) / 10.0);
        pointagesStatutPourcentages.put("REJETE", Math.round((pointagesRejetes / safeTotal) * 100.0 * 10.0) / 10.0);
        pointagesStatutPourcentages.put("EN_ATTENTE", Math.round((pointagesEnAttente / safeTotal) * 100.0 * 10.0) / 10.0);
        pointagesStatutPourcentages.put("EXTRAIT", Math.round((pointagesExtraits / safeTotal) * 100.0 * 10.0) / 10.0);

        // 6. Tâches par Statut
        Map<String, Long> tachesParStatut = new LinkedHashMap<>();
        tachesParStatut.put("NON_DEMARREE", tachesNonDemarrees);
        tachesParStatut.put("EN_COURS", tachesEnCours);
        tachesParStatut.put("TERMINEE", taches.stream()
                .filter(t -> !t.getAffectations().isEmpty()
                        && t.getAffectations().stream()
                        .allMatch(a -> a.getStatut() == StatutTache.TERMINEE))
                .count());

        // 7. Latest 5 Submitted Pointages (from ImagePointage)
        List<ImagePointage> images = imagePointageRepository.findAllByOrderByCreatedAtDesc();
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        List<LatestSubmissionDto> latestSubmissions = images.stream().limit(5).map(img -> {
            List<Pointage> imgPointages = pointageRepository.findByImagePointageId(img.getId());

            // Determine overall status for table badge
            String status = "EXTRAIT";
            if (imgPointages.stream().anyMatch(p -> p.getStatut() == StatutPointage.EN_ATTENTE)) {
                status = "EN_ATTENTE";
            } else if (imgPointages.stream().allMatch(p -> p.getStatut() == StatutPointage.VALIDE) && !imgPointages.isEmpty()) {
                status = "VALIDE";
            } else if (imgPointages.stream().anyMatch(p -> p.getStatut() == StatutPointage.REJETE)) {
                status = "REJETE";
            }

            // Determine date range or single date
            String periode = "—";
            if (!imgPointages.isEmpty()) {
                LocalDate minDate = imgPointages.stream().map(Pointage::getDate).min(LocalDate::compareTo).orElse(null);
                LocalDate maxDate = imgPointages.stream().map(Pointage::getDate).max(LocalDate::compareTo).orElse(null);
                if (minDate != null && maxDate != null) {
                    periode = minDate.equals(maxDate) ? minDate.format(dateFmt) : minDate.format(dateFmt) + " → " + maxDate.format(dateFmt);
                }
            }

            return LatestSubmissionDto.builder()
                    .imageId(img.getId())
                    .prestataireNom(img.getPrestataire() != null ? img.getPrestataire().getNomComplet() : "Prestataire")
                    .prestataireMatricule(img.getPrestataire() != null ? img.getPrestataire().getMatricule() : "Sans matricule")
                    .periode(periode)
                    .soumisLe(img.getCreatedAt())
                    .statut(status)
                    .build();
        }).collect(Collectors.toList());

        // 8. Recent Activities Feed (Top 5)
        List<RecentActivityDto> activities = new ArrayList<>();

        for (ImagePointage img : images.stream().limit(3).collect(Collectors.toList())) {
            activities.add(RecentActivityDto.builder()
                    .id("img-" + img.getId())
                    .type("POINTAGE_SUBMITTED")
                    .title("Nouveau pointage soumis")
                    .description((img.getPrestataire() != null ? img.getPrestataire().getNomComplet() : "Un prestataire") + " a soumis une feuille de pointage.")
                    .timestamp(img.getCreatedAt())
                    .build());
        }

        for (Pointage p : pointages.stream()
                .filter(p -> p.getStatut() == StatutPointage.VALIDE || p.getStatut() == StatutPointage.REJETE)
                .sorted(Comparator.comparing(Pointage::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(3)
                .collect(Collectors.toList())) {

            boolean isValide = p.getStatut() == StatutPointage.VALIDE;
            activities.add(RecentActivityDto.builder()
                    .id("ptg-" + p.getId())
                    .type(isValide ? "POINTAGE_VALIDATED" : "POINTAGE_REJECTED")
                    .title(isValide ? "Un pointage a été validé" : "Un pointage a été rejeté")
                    .description("Pointage du " + p.getDate() + " pour " + (p.getPrestataire() != null ? p.getPrestataire().getNomComplet() : "Prestataire"))
                    .timestamp(p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt())
                    .build());
        }

        for (Prestataire pr : prestataires.stream()
                .sorted(Comparator.comparing(Prestataire::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(2)
                .collect(Collectors.toList())) {
            activities.add(RecentActivityDto.builder()
                    .id("presta-" + pr.getId())
                    .type("PRESTATAIRE_CREATED")
                    .title("Un nouveau prestataire a été ajouté")
                    .description(pr.getNomComplet() + " a rejoint la plateforme.")
                    .timestamp(pr.getCreatedAt())
                    .build());
        }

        List<RecentActivityDto> recentActivities = activities.stream()
                .filter(a -> a.getTimestamp() != null)
                .sorted(Comparator.comparing(RecentActivityDto::getTimestamp).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return AdminDashboardStatsResponse.builder()
                .totalPrestataires(totalPrestataires)
                .prestatairesActifs(prestatairesActifs)
                .totalTaches(totalTaches)
                .tachesEnCours(tachesEnCours)
                .totalPointages(totalPointages)
                .pointagesMois(pointagesMois)
                .pointagesEnAttente(pointagesEnAttente)
                .pointagesValides(pointagesValides)
                .pointagesValidesMois(pointagesValidesMois)
                .pointagesRejetes(pointagesRejetes)
                .monthlyStats(monthlyStats)
                .pointagesParStatut(pointagesParStatut)
                .pointagesStatutPourcentages(pointagesStatutPourcentages)
                .tachesParStatut(tachesParStatut)
                .tachesTermineesAujourdhui(tachesTermineesAujourdhui)
                .latestSubmissions(latestSubmissions)
                .recentActivities(recentActivities)
                .build();
    }
}
