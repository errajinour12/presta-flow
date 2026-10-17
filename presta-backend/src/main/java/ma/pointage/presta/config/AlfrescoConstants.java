package ma.pointage.presta.config;

public class AlfrescoConstants {

    private AlfrescoConstants() {}

    // Lister le contenu d'un dossier / créer un noeud
    public static final String API_NODES = "/nodes";

    // Upload d'un fichier dans un dossier — %s = nodeId du dossier parent
    public static final String API_UPLOAD = "/nodes/%s/children";

    // Télécharger le contenu d'un fichier — %s = nodeId du fichier
    public static final String API_DOWNLOAD = "/nodes/%s/content";

    // Informations d'un nœud
    public static final String API_NODE = "/nodes/%s";
}