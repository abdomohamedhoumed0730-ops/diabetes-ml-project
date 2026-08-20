"""
Module de preprocessing partagé entre l'entraînement (train.py) et l'API (app.py).

Pourquoi un module à part ?
----------------------------
Le modèle sauvegardé (model.joblib) contient un Pipeline scikit-learn complet
(nettoyage + imputation + scaling + modèle). Pour que joblib puisse recharger
ce pipeline correctement, toute classe custom utilisée dedans doit être
importable depuis le même chemin de module des deux côtés (entraînement ET
API). D'où ce fichier séparé, importé par train.py et par app.py.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

# Colonnes du dataset Pima Indians Diabetes où une valeur de 0 est
# biologiquement impossible et représente en réalité une donnée manquante
# (contrairement à "Pregnancies" ou "Outcome", où 0 est une vraie valeur).
COLONNES_ZERO_SUSPECT = [
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
]


class ZeroToNaNTransformer(BaseEstimator, TransformerMixin):
    """
    Transformer scikit-learn qui remplace les 0 par NaN dans les colonnes
    où 0 n'a pas de sens médical (ex: une tension artérielle à 0 est
    impossible chez une personne vivante -> c'est une valeur manquante,
    pas une vraie mesure).

    On ne touche pas aux autres colonnes (ex: "Pregnancies" peut valider
    être 0).
    """

    def __init__(self, colonnes=None):
        self.colonnes = colonnes if colonnes is not None else COLONNES_ZERO_SUSPECT

    def fit(self, X, y=None):
        # Rien à apprendre ici, on garde juste la liste des colonnes
        return self

    def transform(self, X):
        X = X.copy()
        if isinstance(X, pd.DataFrame):
            for col in self.colonnes:
                if col in X.columns:
                    X[col] = X[col].replace(0, np.nan)
        else:
            raise TypeError(
                "ZeroToNaNTransformer attend un pandas DataFrame en entrée."
            )
        return X
