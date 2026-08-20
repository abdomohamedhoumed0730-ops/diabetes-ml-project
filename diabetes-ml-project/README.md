# Projet : Prédiction du diabète — ML + FastAPI

Projet pédagogique de bout en bout : nettoyage de données, entraînement d'un
modèle de Machine Learning, évaluation, et déploiement via une API FastAPI.

## ⚠️ Avertissement important

Le dataset **Pima Indians Diabetes** utilisé ici est un **dataset de
recherche / pédagogique** datant des années 1990, portant sur une population
très spécifique (femmes d'au moins 21 ans, d'origine Pima, aux États-Unis).

**Les résultats de ce projet ne permettent PAS de conclure qu'une personne
donnée est diabétique** et ne doivent en aucun cas remplacer un avis médical
professionnel. Ce projet a un but exclusivement éducatif : apprendre le ML,
le preprocessing, l'évaluation de modèles, et le déploiement via API.

---

## 1. Pipeline du projet

```
Kaggle Dataset (diabetes.csv)
      ↓
Nettoyage / préparation (gestion des 0 biologiquement improbables)
      ↓
Train / Test split (stratifié)
      ↓
Modèle ML (Logistic Regression vs Random Forest, le meilleur est retenu)
      ↓
Évaluation (Accuracy / Precision / Recall / F1 / ROC-AUC)
      ↓
Sauvegarde (models/model.joblib)
      ↓
FastAPI (app.py)
      ↓
POST /predict
      ↓
Réponse JSON
```

## 2. Point d'attention : les zéros dans le dataset

Dans ce dataset, certaines colonnes contiennent des `0` qui ne sont **pas**
de vraies mesures mais des **valeurs manquantes déguisées** (biologiquement
impossibles) :

| Colonne | Nb de valeurs à 0 sur 768 | Pourquoi c'est suspect |
|---|---|---|
| Glucose | 5 | Un taux de glucose à 0 est incompatible avec la vie |
| BloodPressure | 35 | Idem pour la tension artérielle |
| SkinThickness | 227 | Une épaisseur de pli cutané à 0 n'a pas de sens |
| Insulin | 374 | Très probablement un défaut de mesure, pas une vraie valeur |
| BMI | 11 | Un IMC à 0 est impossible |

👉 Ces `0` sont convertis en `NaN` puis imputés par la **médiane** (calculée
uniquement sur le jeu d'entraînement, pour éviter toute fuite de données),
via un `Pipeline` scikit-learn défini dans `preprocessing.py`.

La colonne `Pregnancies` (nombre de grossesses) n'est **pas** concernée : un
`0` y est une valeur parfaitement valide.

## 3. Structure du projet

```
diabetes-ml-project/
├── data/
│   └── diabetes.csv          # Dataset Kaggle (Pima Indians Diabetes)
├── models/
│   ├── model.joblib          # Pipeline complet (preprocessing + modèle) sauvegardé
│   └── metrics.json          # Rapport comparatif des métriques
├── preprocessing.py          # Transformer custom (gestion des 0 suspects)
├── train.py                  # Script d'entraînement + évaluation
├── app.py                    # API FastAPI (endpoint /predict)
├── requirements.txt
└── README.md
```

## 4. Installation (VS Code)

Ouvre le dossier `diabetes-ml-project` dans VS Code, puis dans le terminal
intégré (`` Ctrl+` ``) :

```bash
# 1. Créer un environnement virtuel
python -m venv venv

# 2. L'activer
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate

# 3. Installer les dépendances
pip install -r requirements.txt
```

Dans VS Code, sélectionne bien l'interpréteur Python de `venv` (en bas à
droite, ou via `Ctrl+Shift+P` → "Python: Select Interpreter").

## 5. Entraîner le modèle

```bash
python train.py
```

Ce script :
- charge et nettoie `data/diabetes.csv`,
- entraîne **Logistic Regression** et **Random Forest**,
- affiche leurs métriques (Accuracy, Precision, Recall, F1, ROC-AUC),
- sauvegarde automatiquement le **meilleur des deux** (selon le ROC-AUC)
  dans `models/model.joblib`,
- écrit un rapport comparatif complet dans `models/metrics.json`.

Résultats obtenus sur ce dataset (à titre indicatif, peuvent varier légèrement) :

| Modèle | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| Logistic Regression | 0.708 | 0.600 | 0.500 | 0.545 | **0.813** ✅ retenu |
| Random Forest | 0.727 | 0.643 | 0.500 | 0.563 | 0.809 |

Les deux modèles sont proches. Logistic Regression est retenu de justesse
sur le ROC-AUC (métrique la plus robuste ici car peu sensible au déséquilibre
des classes ~65%/35%). Le Recall (0.50) reste modeste : le modèle rate la
moitié des cas positifs — normal sur un dataset aussi petit (768 lignes) et
c'est justement une bonne occasion d'expliquer, en entretien, la différence
entre Accuracy et Recall, et pourquoi le choix de métrique dépend du contexte
métier (ici, rater un cas positif est plus grave qu'une fausse alerte).

## 6. Lancer l'API en local

```bash
uvicorn app:app --reload
```

L'API tourne sur `http://127.0.0.1:8000`.

Documentation interactive auto-générée (Swagger UI) :
👉 `http://127.0.0.1:8000/docs`

### Tester l'endpoint `/predict`

Avec `curl` :

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Pregnancies": 6,
    "Glucose": 148,
    "BloodPressure": 72,
    "SkinThickness": 35,
    "Insulin": 0,
    "BMI": 33.6,
    "DiabetesPedigreeFunction": 0.627,
    "Age": 50
  }'
```

Réponse attendue :

```json
{
  "prediction": 1,
  "probabilite_diabete": 0.7058,
  "avertissement": "Ce resultat provient d'un modele entraine sur un dataset de recherche (...)"
}
```

Tu peux aussi tester directement depuis `http://127.0.0.1:8000/docs` (bouton
"Try it out"), sans écrire de commande.

## 7. Déployer en ligne (bonus, optionnel)

Pour rendre l'API accessible publiquement, l'option la plus simple pour
débuter est **Render** (offre gratuite, pas de carte bancaire requise) :

1. Crée un dépôt GitHub avec ce projet (`git init`, `git add .`, `git commit`,
   push vers un nouveau repo).
2. Va sur [render.com](https://render.com) → "New +" → "Web Service" →
   connecte ton dépôt GitHub.
3. Configure :
   - **Build command** : `pip install -r requirements.txt`
   - **Start command** : `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Déploie. Render te donne une URL publique du type
   `https://ton-projet.onrender.com/docs`.

Alternatives équivalentes : Railway, Fly.io, ou un conteneur Docker sur
n'importe quel VPS.

## 8. Pour aller plus loin (idées d'amélioration)

- Ajouter une validation croisée (`cross_val_score`) plutôt qu'un simple
  split train/test, pour des métriques plus robustes.
- Gérer le déséquilibre des classes (`class_weight="balanced"`, ou
  sur-échantillonnage type SMOTE).
- Ajouter des tests unitaires (`pytest`) sur `preprocessing.py` et `app.py`.
- Conteneuriser l'API avec Docker pour un déploiement plus portable.
- Ajouter un système de logging des prédictions (utile en prod, avec
  attention au RGPD si données de santé réelles).
