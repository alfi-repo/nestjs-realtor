import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PropertyType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomeDto } from './dto';
import { HomeService } from './home.service';

const mockGetHomes = [
  {
    id: 1,
    address: 'Street Fighter',
    city: 'NightCity',
    price: 7500000,
    property_ttype: PropertyType.RESIDENTAL,
    image: 'img1',
    number_of_bedrooms: 4,
    number_of_bathrooms: 5,
    images: [
      {
        url: 'src1',
      },
    ],
  },
];

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

const mockImages = [
  {
    id: 1,
    url: 'url1',
  },
  {
    id: 2,
    url: 'url2',
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockReturnValue(mockGetHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get<HomeService>(HomeService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('getHomes', () => {
    const filters = {
      city: 'NightCity',
      price: {
        gte: 100000,
        lte: 50000000,
      },
      propertyType: PropertyType.RESIDENTAL,
    };

    it('+ should call prisma home.findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(filters);

      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          id: true,
          address: true,
          city: true,
          price: true,
          propertyType: true,
          number_of_bathrooms: true,
          number_of_bedrooms: true,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: {
          ...filters,
        },
      });
    });

    it('- should throw not found exception if no homes are found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(service.getHomes(filters)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('createMany', () => {
    const homeParams: CreateHomeDto = {
      address: 'Street Fighter',
      city: 'NightCity',
      price: 7500000,
      propertyType: PropertyType.CONDO,
      numberOfBedrooms: 4,
      numberOfBathrooms: 5,
      landSize: 100,
      images: [
        {
          url: 'src1',
        },
      ],
    };
    const homeId = 1;

    it('+ should call prisma home.create with correct payload', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockGetHome);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(homeParams, homeId);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: homeParams.address,
          number_of_bathrooms: homeParams.numberOfBathrooms,
          number_of_bedrooms: homeParams.numberOfBedrooms,
          city: homeParams.city,
          land_size: homeParams.landSize,
          propertyType: homeParams.propertyType,
          price: homeParams.price,
          realtor_id: homeId,
        },
      });
    });

    it('+ should call prisma image.createMany with correct payload', async () => {
      const mockCreateManyImages = jest.fn().mockReturnValue(mockImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateManyImages);

      await service.createHome(homeParams, homeId);

      expect(mockCreateManyImages).toBeCalledWith({
        data: [
          {
            url: homeParams.images[0].url,
            home_id: homeId,
          },
        ],
      });
    });
  });
});
