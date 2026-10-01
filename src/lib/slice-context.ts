import type { ProjectDocument } from "../prismicio-types";

export type SliceContext = {
  project?: ProjectDocument;
  projects?: ProjectDocument[];
};
