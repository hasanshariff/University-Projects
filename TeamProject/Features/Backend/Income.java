package team.bham.entities;

import java.util.Date;
import javax.persistence.*;
import lombok.*;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "Income")
public class Income {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "INCOME_ID")
    private Integer income_ID;

    @Column(name = "NAME")
    private String name;

    @Column(name = "AMOUNT")
    private Float amount;

    @Column(name = "DATE")
    private Date date;
}
