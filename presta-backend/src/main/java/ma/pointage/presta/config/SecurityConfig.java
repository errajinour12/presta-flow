package ma.pointage.presta.config;

import lombok.RequiredArgsConstructor;
import ma.pointage.presta.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // Désactive la protection CSRF (API REST + JWT)
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Aucune session HTTP
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Définition des autorisations
                .authorizeHttpRequests(auth -> auth

                        // Routes publiques
                        .requestMatchers("/api/auth/login").permitAll()

                        // Routes ADMIN
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Endpoint temporaire de test Gemini (a supprimer apres validation)
                        .requestMatchers("/api/test-gemini").permitAll()

                        // Gestion des prestataires — réservée aux admins
                        .requestMatchers("/api/prestataires/**").hasRole("ADMIN")

                        // Gestion des tâches — réservée aux admins
                        .requestMatchers("/api/taches/**").hasRole("ADMIN")

                        // Gestion des affectations — réservée aux admins
                        .requestMatchers("/api/affectations/**").hasRole("ADMIN")

                        // Routes PRESTATAIRE
                        .requestMatchers("/api/prestataire/**").hasRole("PRESTATAIRE")

                        // Toute autre requête nécessite une authentification
                        .anyRequest().authenticated()
                )

                // Provider d'authentification
                .authenticationProvider(authenticationProvider)

                // Notre filtre JWT avant le filtre de Spring Security
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}