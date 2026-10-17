package ma.pointage.presta.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "alfresco")
@Data
public class AlfrescoProperties {

    private String url;
    private String username;
    private String password;

    private Folder folder = new Folder();

    @Data
    public static class Folder {
        private String nodeId;
    }
}