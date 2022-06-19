import {
  Controller,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PropertyType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHomeDto } from './dto';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

const mockGetHome = {
  id: 1,
  address: 'Street Fighter',
  city: 'NightCity',
  price: 7500000,
  property_ttype: PropertyType.RESIDENTAL,
  image: 'img1',
  number_of_bedrooms: 4,
  number_of_bathrooms: 5,
};

describe('HomeController', () => {
  let homeController: HomeController;
  let homeService: HomeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHomes: jest.fn().mockReturnValue([]),
            getRealtorByHomeId: jest.fn().mockReturnValue({
              id: 22,
              name: 'User',
              phone: '(123) 123 1234',
              email: 'user@gmail.com',
            }),
            updateHomeById: jest.fn().mockReturnValue(mockGetHome),
          },
        },
        PrismaService,
      ],
    }).compile();

    homeService = moduleRef.get<HomeService>(HomeService);
    homeController = moduleRef.get<HomeController>(HomeController);
  });

  describe('getHomes', () => {
    it('+ should construct filter object correctly', async () => {
      const mockGetHomes = jest.fn().mockReturnValue([]);
      jest.spyOn(homeService, 'getHomes').mockImplementation(mockGetHomes);
      await homeController.getHomes('SunCity', '10000');
      expect(mockGetHomes).toBeCalledWith({
        city: 'SunCity',
        price: {
          gte: 10000,
        },
      });
    });
  });

  describe('updateHome', () => {
    const updateHomeParams: UpdateHomeDto = {
      address: 'Street Fighter',
      city: 'NightCity',
      price: 7500000,
      propertyType: PropertyType.CONDO,
      numberOfBedrooms: 4,
      numberOfBathrooms: 5,
      landSize: 100,
    };

    const mockUserInfo = {
      name: 'User',
      id: 99,
      iat: 1,
      exp: 2,
    };

    it('- should throw unauth error if realtor did not create home', async () => {
      await expect(
        homeController.updateHome(1, updateHomeParams, mockUserInfo),
      ).rejects.toThrowError(UnauthorizedException);
    });

    it('+ should update home if realtor id is valid', async () => {
      const mockUpdateHome = jest.fn().mockReturnValue(mockGetHome);
      jest
        .spyOn(homeService, 'updateHomeById')
        .mockImplementation(mockUpdateHome);
      await homeController.updateHome(1, updateHomeParams, {
        ...mockUserInfo,
        id: 22,
      });
      expect(mockUpdateHome).toBeCalled();
    });
  });
});
