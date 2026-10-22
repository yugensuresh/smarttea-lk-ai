import { Navigate } from "react-router-dom";
import { DISEASE_DETECTION_PATH } from "../config/member01Nav";

/** Legacy route — severity UI lives on Disease Detection. */
export default function SeverityEstimation() {
  return <Navigate to={`${DISEASE_DETECTION_PATH}#severity-assessment`} replace />;
}
