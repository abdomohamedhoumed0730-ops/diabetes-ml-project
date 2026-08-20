"""
train.py
========

Pipeline complet d'entraînement pour le projet de prédiction du diabète
(dataset Pima Indians Diabetes).

⚠️ AVERTISSEMENT IMPORTANT ⚠️
-------------------------------
Le dataset "Pima Indians Diabetes" est un dataset de RECHERCHE / PÉDAGOGIQUE
datant des années 1990, portant sur une population très spécifique (femmes
d'au moins 21 ans, d'origine Pima, USA). Les résultats de ce projet :
  - ne sont PAS un outil de diagnostic médical,
  - ne permettent PAS de conclure qu'une personne donnée est diabétique,
  - ne doivent JAMAIS remplacer un avis médical professionnel.
Ce projet a un but exclusivement éducatif (ML, preprocessing, API, déploiement).

Ce que fait ce script :
  1. Charge data/diabetes.csv
  2. Remplace les 0 biologiquement improbables par NaN (voir preprocessing.py)
  3. Sépare train/test (stratifié sur Outcome)
  4. Construit un Pipeline scikit-learn (imputation médiane -> scaling -> modèle)
  5. Entraîne ET compare Logistic Regression et Random Forest
  6. Évalue les deux (Accuracy, Precision, Recall, F1, ROC-AUC)
  7. Sauvegarde le meilleur modèle (selon ROC-AUC) dans models/model.joblib
  8. Sauvegarde un rapport de métriques dans models/metrics.json
"""

import json
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from preprocessing import ZeroToNaNTransformer

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
DATA_PATH = Path("data/diabetes.csv")
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

FEATURES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]
TARGET = "Outcome"

RANDOM_STATE = 42


def charger_donnees(path: Path) -> pd.DataFrame:
    """Charge le CSV et vérifie que les colonnes attendues sont présentes."""
    df = pd.read_csv(path)
    colonnes_attendues = set(FEATURES + [TARGET])
    if not colonnes_attendues.issubset(df.columns):
        manquantes = colonnes_attendues - set(df.columns)
        raise ValueError(f"Colonnes manquantes dans le CSV : {manquantes}")
    return df


def construire_pipeline(modele) -> Pipeline:
    """
    Construit un pipeline complet : nettoyage des 0 -> imputation médiane
    -> standardisation -> modèle. L'ensemble est sauvegardé comme UN SEUL
    objet, pour garantir que l'API applique exactement le même preprocessing
    qu'à l'entraînement (pas de risque de "train/serve skew").
    """
    return Pipeline(
        steps=[
            ("zero_to_nan", ZeroToNaNTransformer()),
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", modele),
        ]
    )


def evaluer(pipeline: Pipeline, X_test, y_test, nom_modele: str) -> dict:
    """Calcule les métriques standards de classification binaire."""
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    metriques = {
        "modele": nom_modele,
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
    }

    print(f"\n=== {nom_modele} ===")
    for cle, valeur in metriques.items():
        if cle != "modele":
            print(f"  {cle:10s}: {valeur}")
    print("\nRapport de classification détaillé :")
    print(classification_report(y_test, y_pred, target_names=["Non diabétique", "Diabétique"]))

    return metriques


def main():
    print("Chargement des données...")
    df = charger_donnees(DATA_PATH)
    print(f"  -> {df.shape[0]} lignes, {df.shape[1]} colonnes")

    X = df[FEATURES]
    y = df[TARGET]

    # Split stratifié pour garder la même proportion de diabétiques/non-diabétiques
    # dans le train et le test (important car les classes sont déséquilibrées : ~65%/35%)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    print(f"  -> Train : {X_train.shape[0]} lignes | Test : {X_test.shape[0]} lignes")

    # ------------------------------------------------------------------
    # Modèle 1 : Logistic Regression
    # ------------------------------------------------------------------
    pipeline_lr = construire_pipeline(
        LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)
    )
    pipeline_lr.fit(X_train, y_train)
    metriques_lr = evaluer(pipeline_lr, X_test, y_test, "Logistic Regression")

    # ------------------------------------------------------------------
    # Modèle 2 : Random Forest
    # ------------------------------------------------------------------
    pipeline_rf = construire_pipeline(
        RandomForestClassifier(
            n_estimators=300, max_depth=6, random_state=RANDOM_STATE
        )
    )
    pipeline_rf.fit(X_train, y_train)
    metriques_rf = evaluer(pipeline_rf, X_test, y_test, "Random Forest")

    # ------------------------------------------------------------------
    # Sélection du meilleur modèle (critère : ROC-AUC)
    # ------------------------------------------------------------------
    candidats = [
        (pipeline_lr, metriques_lr),
        (pipeline_rf, metriques_rf),
    ]
    meilleur_pipeline, meilleures_metriques = max(
        candidats, key=lambda c: c[1]["roc_auc"]
    )

    print(f"\n>>> Meilleur modèle retenu : {meilleures_metriques['modele']} "
          f"(ROC-AUC = {meilleures_metriques['roc_auc']})")

    # Sauvegarde du pipeline complet (preprocessing + modèle en un seul objet)
    import joblib

    chemin_modele = MODELS_DIR / "model.joblib"
    joblib.dump(meilleur_pipeline, chemin_modele)
    print(f"Modèle sauvegardé -> {chemin_modele}")

    # Sauvegarde du rapport comparatif complet
    rapport = {
        "modele_retenu": meilleures_metriques["modele"],
        "resultats": {
            "logistic_regression": metriques_lr,
            "random_forest": metriques_rf,
        },
        "avertissement": (
            "Dataset de recherche/pedagogique (Pima Indians Diabetes). "
            "Ces resultats ne permettent pas de conclure qu'une personne "
            "donnee est diabetique et ne remplacent pas un avis medical."
        ),
    }
    chemin_rapport = MODELS_DIR / "metrics.json"
    with open(chemin_rapport, "w", encoding="utf-8") as f:
        json.dump(rapport, f, indent=2, ensure_ascii=False)
    print(f"Rapport de métriques sauvegardé -> {chemin_rapport}")


if __name__ == "__main__":
    main()
