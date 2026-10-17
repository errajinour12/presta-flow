package ma.pointage.presta.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;

@Entity
@Table(name = "creneaux_pointage")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true, exclude = "pointage")
@ToString(callSuper = true, exclude = "pointage")
public class CreneauPointage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalTime heureEntree;

    @Column(nullable = false)
    private LocalTime heureSortie;

    @Column(nullable = false)
    private Integer ordre; // pas obligatoire

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pointage_id", nullable = false)
    private Pointage pointage;
}