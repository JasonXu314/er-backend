import { IsJSON, IsString, Length } from 'class-validator';
import { forceInit } from 'src/utils';

export class ERDiagram {
	author: string = forceInit();
	name: string = forceInit();
	diagram: string = forceInit();
	preview: string = forceInit();
}

export class CreateDiagramDTO {
	@IsString()
	@Length(1, 32)
	author: string = forceInit();

	@IsString()
	@Length(1, 32)
	name: string = forceInit();

	@IsJSON()
	diagram: string = forceInit();
}

export class UpdateDiagramDTO {
	@IsJSON()
	diagram: string = forceInit();
}

