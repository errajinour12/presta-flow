package ma.pointage.presta.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "images_pointage")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true, exclude = {
        "prestataire",
        "pointages"
})
@ToString(callSuper = true, exclude = {
        "prestataire",
        "pointages"
})
public class ImagePointage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String alfrescoNodeId;

    @Column(nullable = false, length = 255)
    private String nomOriginal;

    @Column(nullable = false, length = 100)
    private String mimeType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prestataire_id", nullable = false)
    private Prestataire prestataire;

    @OneToMany(mappedBy = "imagePointage", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Pointage> pointages = new ArrayList<>();

}