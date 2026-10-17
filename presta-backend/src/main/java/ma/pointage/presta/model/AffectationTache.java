package ma.pointage.presta.model;

import ma.pointage.presta.model.enums.StatutTache;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "affectations_taches")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true, exclude = {
        "prestataire",
        "tache"
})
@ToString(callSuper = true, exclude = {
        "prestataire",
        "tache"
})
public class AffectationTache extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dateAffectation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTache statut;

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prestataire_id", nullable = false)
    private Prestataire prestataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tache_id", nullable = false)
    private Tache tache;

    @PrePersist
    protected void onCreate() {

        if (dateAffectation == null) {
            dateAffectation = LocalDateTime.now();
        }

        if (statut == null) {
            statut = StatutTache.NON_DEMARREE;
        }
    }
}