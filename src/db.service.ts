import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MongoClient, ObjectId, WithId } from 'mongodb';
import { CreateDiagramDTO, ERDiagram } from './models/diagram.model';

@Injectable()
export class DBService {
	private _db: Promise<MongoClient>;
	private _logger: Logger;

	constructor() {
		this._logger = new Logger('DB');
		this._db = MongoClient.connect(process.env.MONGODB_URL!)
			.then((client) => {
				this._logger.log('Connected to DB');
				return client;
			})
			.catch((err) => {
				this._logger.log(`Failed to connect to DB: ${err}`);
				return null as unknown as MongoClient;
			});
	}

	public async getDiagrams(): Promise<WithId<ERDiagram>[]> {
		return (await this._db).db(this._getDB()).collection<ERDiagram>('diagrams').find().toArray();
	}

	public async getDiagramById(id: string): Promise<WithId<ERDiagram> | null> {
		return (await this._db)
			.db(this._getDB())
			.collection<ERDiagram>('diagrams')
			.findOne({ _id: ObjectId.createFromHexString(id) });
	}

	public async createDiagram(data: CreateDiagramDTO, preview: string): Promise<WithId<ERDiagram> | null> {
		const _id = (
			await (
				await this._db
			)
				.db(this._getDB())
				.collection<ERDiagram>('diagrams')
				.insertOne({ ...data, preview })
		).insertedId;

		return (await this._db).db(this._getDB()).collection<ERDiagram>('diagrams').findOne({ _id });
	}

	public async updateDiagram(id: string, data: string): Promise<void> {
		await (
			await this._db
		)
			.db(this._getDB())
			.collection<ERDiagram>('diagrams')
			.updateOne({ _id: ObjectId.createFromHexString(id) }, { $set: { diagram: data } });
	}

	private _getDB(): string {
		switch (process.env.STAGE) {
			case 'test':
				return 'staging';
			case 'local':
			case 'live':
				return 'main';
			default:
				this._logger.log(`Unrecognized staging environment ${process.env.STAGE}`);
				throw new InternalServerErrorException(`Unrecognized staging environment ${process.env.STAGE}`);
		}
	}
}

