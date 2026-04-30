import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganisationAccessService } from './organisation-access.service';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrganisationsController],
  providers: [OrganisationsService, OrganisationAccessService],
  exports: [OrganisationAccessService],
})
export class OrganisationsModule {}
