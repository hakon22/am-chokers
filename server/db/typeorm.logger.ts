import { LoggerService } from '@server/services/app/logger.service';

import { Logger, QueryRunner } from 'typeorm';
import { Container, Singleton } from 'typescript-ioc';

@Singleton
export class TypeormLogger implements Logger {
  private logger = Container.get(LoggerService);

  public log(level: 'log' | 'info' | 'warn', message: string, queryRunner?: QueryRunner): void {
    if (level === 'log') {
      if (queryRunner) {
        this.logger.debug('SQL', queryRunner.getMemorySql());
      }
      if (message) {
        this.logger.debug('SQL', message);
      }
    } else if (level === 'info') {
      if (queryRunner) {
        this.logger.info('SQL', queryRunner.getMemorySql());
      }
      if (message) {
        this.logger.info('SQL', message);
      }
    } else if (level === 'warn') {
      if (queryRunner) {
        this.logger.warn('SQL', queryRunner.getMemorySql());
      }
      if (message) {
        this.logger.warn('SQL', message);
      }
    }
  }

  public logMigration(message: string): void {
    if (message) {
      this.logger.debug('SQL', message);
    }
  }

  public logQuery(query: string, parameters?: string[]): void {
    if (query) {
      this.logger.debug('SQL', query);
    }
    if (parameters && parameters.length > 0) {
      this.logger.debug('SQL', parameters);
    }
  }

  public logQueryError(error: string, query: string, parameters?: string[]): void {
    if (error && query) {
      this.logger.error('SQL', error, ':', query);
    }
    if (parameters && parameters.length > 0) {
      this.logger.error('SQL', parameters);
    }
  }

  public logQuerySlow(time: number, query: string, parameters?: string[]): void {
    if (time) {
      this.logger.error('SQL', `SLOW QUERY: ${time}`);
    }
    if (query) {
      this.logger.error('SQL', query);
    }
    if (parameters && parameters.length > 0) {
      this.logger.error('SQL', parameters);
    }
  }

  public logSchemaBuild(message: string): void {
    if (message) {
      this.logger.debug('SQL', message);
    }
  }
}
