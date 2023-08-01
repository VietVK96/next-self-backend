export class SectionsDto {
  Praticiens?: {
    sources: { id: string; name: string }[];
    targets: { id: string; name: string }[];
  };
  Agendas?: {
    sources: { id: string; name: string }[];
    targets: { id: string; name: string }[];
  };
}
