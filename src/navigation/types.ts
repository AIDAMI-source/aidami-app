export type RootTabParamList = {
  Accueil: undefined;
  Foyer: undefined;
  Taches: undefined;
  Comportements: undefined;
  Memoire: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
