package ma.pointage.presta.dto.auth;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO représentant la réponse après une authentification réussie.
 * Contient le token JWT d'accès et les informations de base de l'utilisateur.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    // Token JWT d'accès — durée de vie : 24h
    private String accessToken;

    // Email de l'utilisateur authentifié
    private String email;

    // Rôle de l'utilisateur (ADMIN ou PRESTATAIRE)
    private String role;

    // Nom complet de l'utilisateur
    private String nomComplet;
}
