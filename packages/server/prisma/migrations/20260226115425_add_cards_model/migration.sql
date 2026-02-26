-- CreateTable
CREATE TABLE `Card` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nameKing` VARCHAR(191) NOT NULL,
    `typeKing` VARCHAR(191) NOT NULL,
    `descKing` TEXT NOT NULL,
    `namePeasant` VARCHAR(191) NOT NULL,
    `typePeasant` VARCHAR(191) NOT NULL,
    `descPeasant` TEXT NOT NULL,
    `copies` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
