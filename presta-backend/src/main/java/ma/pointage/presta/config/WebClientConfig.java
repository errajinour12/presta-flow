package ma.pointage.presta.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Base64;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient alfrescoWebClient(AlfrescoProperties properties) {

        // Encodage Basic Auth : admin:admin en Base64
        String credentials = properties.getUsername() + ":" + properties.getPassword();
        String basicAuth = "Basic " + Base64.getEncoder()
                .encodeToString(credentials.getBytes());

        return WebClient.builder()
                .baseUrl(properties.getUrl() + "/alfresco/api/-default-/public/alfresco/versions/1")
                .defaultHeader("Authorization", basicAuth)
                .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }

    @Bean
    public WebClient geminiWebClient(GeminiProperties geminiProperties) {
        return WebClient.builder()
                .baseUrl(geminiProperties.getUrl())
                .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }
}
