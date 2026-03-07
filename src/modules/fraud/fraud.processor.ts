import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { FraudAnalysisJob } from '../../common/interfaces/fraud-analysis-job.interface';
import { FRAUD_ANALYSIS_QUEUE } from './fraud.constants';
import { FraudService } from './fraud.service';

@Processor(FRAUD_ANALYSIS_QUEUE)
export class FraudProcessor extends WorkerHost {
  constructor(private readonly fraudService: FraudService) {
    super();
  }

  async process(job: Job<FraudAnalysisJob>) {
    await this.fraudService.handleFraudAnalysis(job.data);
  }
}