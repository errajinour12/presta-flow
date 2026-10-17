package ma.pointage.presta.model;

import ma.pointage.presta.model.enums.Role;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prestataires")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true, exclude = {
        "admin",
        "rapports",
        "pointages",
        "affectations",
        "imagesPointage"
})
@ToString(callSuper = true, exclude = {
        "admin",
        "rapports",
        "pointages",
        "affectations",
        "imagesPointage"
})
public class Prestataire extends Utilisateur {

    @Column(nullable = false)
    private LocalDate dateNaissance;

    @Column(nullable = false)
    private LocalDate dateEmbauche;

    @Column(nullable = false)
    private boolean actif = true;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private Admin admin;

    @OneToMany(mappedBy = "prestataire", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Rapport> rapports = new ArrayList<>();

    @OneToMany(mappedBy = "prestataire", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Pointage> pointages = new ArrayList<>();

    @OneToMany(mappedBy = "prestataire", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AffectationTache> affectations = new ArrayList<>();

    @OneToMany(mappedBy = "prestataire", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ImagePointage> imagesPointage = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (getRole() == null) {
            setRole(Role.PRESTATAIRE);
        }
    }
}