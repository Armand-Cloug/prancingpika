#!/bin/bash

# 1) Créer le dossier temporaire attendu (si absent)
#    Utile si l'app web utilise un répertoire .tmp pour écrire des fichiers intermédiaires (upload, rename, etc.)
sudo mkdir -p /var/lib/docker/volumes/ptpika_combatlogs/_data/.tmp

# 2) Donner la propriété au user du conteneur web (uid=100 gid=101)
#    Le conteneur web tourne en nextjs (uid=100 gid=101), donc il doit être propriétaire du volume pour écrire.
sudo chown -R 100:101 /var/lib/docker/volumes/ptpika_combatlogs/_data

# 3) Droits en lecture/écriture pour le propriétaire (et lecture/exécution pour groupe)
#    u+rwX : le propriétaire peut lire/écrire, et "X" met l'exec uniquement sur les dossiers (ou fichiers déjà exec)
#    g+rX  : le groupe peut lire, et entrer dans les dossiers (exec sur dossiers)
sudo chmod -R u+rwX,g+rX /var/lib/docker/volumes/ptpika_combatlogs/_data

# 4) (Optionnel mais utile) S'assurer que les nouveaux fichiers gardent le groupe 101
#    Le bit setgid sur un dossier force les nouveaux fichiers/sous-dossiers à hériter du groupe (ici 101).
sudo chmod g+s /var/lib/docker/volumes/ptpika_combatlogs/_data

# 5) Redémarrer le conteneur web (au cas où le process était dans un état incohérent après une erreur)
sudo docker restart ptpika_web

# 6) Récupérer le chemin réel du volume Docker (mountpoint côté VM)
#    Important : le format ci-dessous doit être EXACT, sans "7)" ni autre texte au milieu.
MP=$(sudo docker volume inspect ptpika_combatlogs -f '{{.Mountpoint}}')

# 7) Afficher le mountpoint pour vérification
echo "$MP"

# 8) Donner au conteneur parser (uid=10001) des droits RWX via ACL, sans changer l'owner (web reste owner)
#    -m  : ajoute/modifie une règle ACL pour l'utilisateur 10001
#    -d  : ACL par défaut, appliquée aux nouveaux fichiers/dossiers créés dans ce répertoire
sudo setfacl -R -m u:10001:rwx "$MP"
sudo setfacl -R -d -m u:10001:rwx "$MP"