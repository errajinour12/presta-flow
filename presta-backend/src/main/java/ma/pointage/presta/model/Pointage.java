package ma.pointage.presta.model;

import ma.pointage.presta.model.enums.OrigineDonnees;
import ma.pointage.presta.model.enums.StatutPointage;
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
@Table(name = "pointages")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true, exclude = {
        "prestataire",
        "traitePar",
        "pointageOrigine",
        "creneaux",
        "imagePointage"
})
@ToString(callSuper = true, exclude = {
        "prestataire",
        "traitePar",
        "pointageOrigine",
        "creneaux",
        "imagePointage"
})
public class Pointage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPointage statut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrigineDonnees origineDonnees;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pointage_origine_id")
    private Pointage pointageOrigine;

    @Column(columnDefinition = "TEXT")
    private String motifRejet;

    private String dayType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prestataire_id", nullable = false)
    private Prestataire prestataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_admin_id")
    private Admin traitePar;

    @OneToMany(mappedBy = "pointage", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CreneauPointage> creneaux = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_pointage_id", nullable = false)
    private ImagePointage imagePointage;

    @PrePersist
    protected void onCreate() {
        if (statut == null) {
            statut = StatutPointage.EXTRAIT;
        }
    }
}