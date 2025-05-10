import { AllAgentConfigsType } from "@/app/types";
import mathTutors from "./mathTutors";

export const allAgentSets: AllAgentConfigsType = {  
  MultiAgentica: mathTutors,
};

export const defaultAgentSetKey = "MultiAgentica";
