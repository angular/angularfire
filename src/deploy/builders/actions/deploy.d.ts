import { BuilderContext } from '@angular-devkit/architect/src/index2';
import { FirebaseTools } from '../../shared/types';
export default function deploy(firebaseTools: FirebaseTools, context: BuilderContext, projectRoot: string, firebaseProject?: string): Promise<void>;
