package ma.pointage.presta.mapper;

import ma.pointage.presta.dto.request.PrestataireRequest;
import ma.pointage.presta.dto.response.PrestataireResponse;
import ma.pointage.presta.model.Admin;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.enums.Role;
import org.springframework.security.crypto.password.PasswordEncoder;

public final class PrestataireMapper {

    private PrestataireMapper() {
    }
    public static PrestataireResponse toResponse(Prestataire prestataire) {

        if (prestataire == null) {
            return null;
        }

        return PrestataireResponse.builder()
                .id(prestataire.getId())
                .matricule(prestataire.getMatricule())
                .nom(prestataire.getNom())
                .prenom(prestataire.getPrenom())
                .email(prestataire.getEmail())
                .dateNaissance(prestataire.getDateNaissance())
                .dateEmbauche(prestataire.getDateEmbauche())
                .actif(prestataire.isActif())
                .adminId(
                        prestataire.getAdmin() != null
                                ? prestataire.getAdmin().getId()
                                : null
                )
                .adminNomComplet(
                        prestataire.getAdmin() != null
                                ? prestataire.getAdmin().getNomComplet()
                                : null
                )
                .createdAt(prestataire.getCreatedAt())
                .updatedAt(prestataire.getUpdatedAt())
                .build();
    }

    public static Prestataire toEntity(
            PrestataireRequest request,
            Admin admin,
            PasswordEncoder passwordEncoder
    ) {

        if (request == null) {
            return null;
        }

        return Prestataire.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .matricule(request.getMatricule())
                .motDePasse(passwordEncoder.encode(request.getMotDePasse()))
                .dateNaissance(request.getDateNaissance())
                .dateEmbauche(request.getDateEmbauche())
                .actif(true)
                .admin(admin)
                .role(Role.PRESTATAIRE)
                .build();
    }
}