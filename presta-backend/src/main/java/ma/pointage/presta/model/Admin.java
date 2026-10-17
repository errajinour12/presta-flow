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

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admins")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true, exclude = {
        "pointagesValides",
        "prestatairesGeres"
})

@ToString(callSuper = true, exclude = {
        "pointagesValides",
        "prestatairesGeres"
})
public class Admin extends Utilisateur {

    @OneToMany(mappedBy = "traitePar")
    @Builder.Default
    private List<Pointage> pointagesValides = new ArrayList<>();

    @OneToMany(mappedBy = "admin")
    @Builder.Default
    private List<Prestataire> prestatairesGeres = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (getRole() == null) {
            setRole(Role.ADMIN);
        }
    }
}