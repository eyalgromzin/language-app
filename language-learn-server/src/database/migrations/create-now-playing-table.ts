import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateNowPlayingTable1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'now_playing',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '500',
            isUnique: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'thumbnailUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'length',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'languageId',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'now_playing',
      new TableForeignKey({
        columnNames: ['languageId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'languages',
        onDelete: 'CASCADE',
      })
    );

    // Add indexes
    await queryRunner.createIndex(
      'now_playing',
      new TableIndex({
        name: 'IDX_NOW_PLAYING_LANGUAGE_UPDATED',
        columnNames: ['languageId', 'updatedAt']
      })
    );

    await queryRunner.createIndex(
      'now_playing',
      new TableIndex({
        name: 'IDX_NOW_PLAYING_URL',
        columnNames: ['url']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('now_playing');
  }
}
