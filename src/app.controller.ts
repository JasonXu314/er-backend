import {
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
	UploadedFile,
	UseInterceptors,
	ValidationPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { default as axios } from 'axios';
import { Blob, FormData } from 'formdata-node';
import { WithId } from 'mongodb';
import { DBService } from './db.service';
import { CreateDiagramDTO, ERDiagram, UpdateDiagramDTO } from './models/diagram.model';

@Controller()
export class AppController {
	constructor(private readonly dbService: DBService) {}

	@Get('/')
	public async getDiagrams(
		@Query('id', new ValidationPipe({ skipUndefinedProperties: true, expectedType: String })) id?: string
	): Promise<WithId<ERDiagram>[] | WithId<ERDiagram>> {
		if (id) {
			const diagram = await this.dbService.getDiagramById(id);

			if (!diagram) {
				throw new NotFoundException(`No diagram with name ${id}`);
			}

			return diagram;
		} else {
			return this.dbService.getDiagrams();
		}
	}

	@Get('/:id')
	public async getDiagramByName(@Param('id', new ValidationPipe({ expectedType: String })) id: string): Promise<WithId<ERDiagram>> {
		const diagram = await this.dbService.getDiagramById(id);

		if (!diagram) {
			throw new NotFoundException(`No diagram with id ${id}`);
		}

		return diagram;
	}

	@Patch('/:id')
	@UseInterceptors(FileInterceptor('preview'))
	public async updateDiagram(
		@Param('id', new ValidationPipe({ expectedType: String })) id: string,
		@Body() body: UpdateDiagramDTO,
		@UploadedFile() preview: Express.Multer.File
	): Promise<void> {
		const diagram = await this.dbService.getDiagramById(id);

		if (!diagram) {
			throw new NotFoundException(`No diagram with id ${id}`);
		}

		const fileData = new FormData();
		fileData.append('file', new Blob([preview.buffer], { type: preview.mimetype }), `preview-${diagram.author}-${diagram.name}.png`);
		await axios.put(diagram.preview, fileData);

		return this.dbService.updateDiagram(id, body.diagram);
	}

	@Post('/')
	@UseInterceptors(FileInterceptor('preview'))
	public async uploadDiagram(@Body() data: CreateDiagramDTO, @UploadedFile() preview: Express.Multer.File): Promise<WithId<ERDiagram>> {
		const fileData = new FormData();
		fileData.append('file', new Blob([preview.buffer], { type: preview.mimetype }), `preview-${data.author}-${data.name}.png`);
		const res = await axios.post(process.env.CDN_URL!, fileData);

		const result = await this.dbService.createDiagram(data, `${process.env.CDN_URL}/${res.data}`);

		if (!result) {
			throw new InternalServerErrorException('Failed to create/retrieve diagram');
		}

		return result;
	}
}

