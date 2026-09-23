import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';

@Module({ imports: [AuthModule], controllers: [NavigationController], providers: [NavigationService] })
export class NavigationModule {}
