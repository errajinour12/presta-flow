package ma.pointage.presta.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.pointage.presta.dto.auth.AuthResponse;
import ma.pointage.presta.dto.auth.ChangePasswordRequest;
import ma.pointage.presta.dto.auth.LoginRequest;
import ma.pointage.presta.dto.auth.UserProfileResponse;
import ma.pointage.presta.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse me() {
        return authService.me();
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(authService.getProfile());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès."));
    }
}