-- CreateTable
CREATE TABLE `Friendship` (
    `idFriendship` INTEGER NOT NULL AUTO_INCREMENT,
    `idSender` INTEGER NOT NULL,
    `idReceiver` INTEGER NOT NULL,
    `status` ENUM('ACCEPTED', 'PENDING', 'DENIED') NOT NULL DEFAULT 'PENDING',

    UNIQUE INDEX `Friendship_idSender_idReceiver_key`(`idSender`, `idReceiver`),
    PRIMARY KEY (`idFriendship`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_idSender_fkey` FOREIGN KEY (`idSender`) REFERENCES `User`(`idUser`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_idReceiver_fkey` FOREIGN KEY (`idReceiver`) REFERENCES `User`(`idUser`) ON DELETE RESTRICT ON UPDATE CASCADE;
