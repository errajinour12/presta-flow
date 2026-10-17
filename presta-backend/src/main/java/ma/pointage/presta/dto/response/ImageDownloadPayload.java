package ma.pointage.presta.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.core.io.Resource;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageDownloadPayload {

    private Resource resource;
    private String nomOriginal;
    private String mimeType;
}
