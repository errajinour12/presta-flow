package ma.pointage.presta.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.pointage.presta.dto.auth.AuthResponse;
import ma.pointage.presta.dto.auth.ChangePasswordRequest;
import ma.pointage.presta.dto.auth.LoginRequest;
import ma.pointage.presta.dto.auth.UserProfileResponse;
import ma.pointage.presta.exception.AccountDisabledException;
import ma.pointage.presta.exception.BusinessException;
import ma.pointage.presta.exception.ResourceNotFoundException;
import ma.pointage.presta.model.Prestataire;
import ma.pointage.presta.model.Utilisateur;
import ma.pointage.presta.repository.UtilisateurRepository;
import ma.pointage.presta.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getMotDePasse()
                )
        );
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();

        if (utilisateur instanceof Prestataire prestataire) {
            if (!prestataire.isActif()) {
                throw new AccountDisabledException("Votre compte est désactivé. Veuillez contacter votre administrateur.");
            }
        }

        String accessToken = jwtService.generateToken(utilisateur);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .email(utilisateur.getEmail())
                .role(utilisateur.getRole().name())
                .nomComplet(utilisateur.getNomComplet())
                .build();
    }

    public AuthResponse me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();

        return AuthResponse.builder()
                .email(utilisateur.getEmail())
                .role(utilisateur.getRole().name())
                .nomComplet(utilisateur.getNomComplet())
                .build();
    }

    /**
     * Récupère le profil détaillé de l'utilisateur actuellement authentifié (Admin ou Prestataire).
     */
    public UserProfileResponse getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'email : " + email));

        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .id(utilisateur.getId())
                .matricule(utilisateur.getMatricule())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .nomComplet(utilisateur.getNomComplet())
                .email(utilisateur.getEmail())
                .role(utilisateur.getRole().name())
                .createdAt(utilisateur.getCreatedAt());

        if (utilisateur instanceof Prestataire prestataire) {
            builder.dateNaissance(prestataire.getDateNaissance())
                    .dateEmbauche(prestataire.getDateEmbauche())
                    .actif(prestataire.isActif());
            if (prestataire.getAdmin() != null) {
                builder.adminNomComplet(prestataire.getAdmin().getNomComplet());
            }
        } else {
            builder.actif(true);
        }

        return builder.build();
    }

    /**
     * Modifie le mot de passe de l'utilisateur actuellement authentifié.
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        if (!request.getNouveauMotDePasse().equals(request.getConfirmationMotDePasse())) {
            throw new BusinessException("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable avec l'email : " + email));

        if (!passwordEncoder.matches(request.getAncienMotDePasse(), utilisateur.getMotDePasse())) {
            throw new BusinessException("Le mot de passe actuel est incorrect.");
        }

        if (passwordEncoder.matches(request.getNouveauMotDePasse(), utilisateur.getMotDePasse())) {
            throw new BusinessException("Le nouveau mot de passe doit être différent de l'ancien mot de passe.");
        }

        utilisateur.setMotDePasse(passwordEncoder.encode(request.getNouveauMotDePasse()));
        utilisateurRepository.save(utilisateur);
        log.info("Mot de passe modifié avec succès pour l'utilisateur : {}", email);
    }
}