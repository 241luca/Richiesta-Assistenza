import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ResponseFormatter } from '../utils/responseFormatter';

const prisma = new PrismaClient();

export class ProfileImageService {
  private readonly uploadsDir = path.join(process.cwd(), '..', 'uploads');
  private readonly profileImagesDir = path.join(this.uploadsDir, 'profiles');
  private readonly profileThumbsDir = path.join(this.uploadsDir, 'profile-thumbs');

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Crea le cartelle necessarie per salvare le immagini
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.profileImagesDir, { recursive: true });
      await fs.mkdir(this.profileThumbsDir, { recursive: true });
    } catch (error) {
      console.error('Errore creazione directory:', error);
    }
  }

  /**
   * Valida l'immagine del profilo
   */
  async validateProfileImage(file: Express.Multer.File): Promise<boolean> {
    // Controlla il tipo di file (deve essere un'immagine)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.mimetype)) {
      throw new Error('Formato non valido. Usa JPG, PNG o WebP');
    }

    // Controlla la dimensione massima (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File troppo grande. Massimo 5MB');
    }

    // Controlla le dimensioni minime dell'immagine con sharp
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Impossibile leggere le dimensioni dell\'immagine');
    }

    if (metadata.width < 200 || metadata.height < 200) {
      throw new Error('Immagine troppo piccola. Minimo 200x200px');
    }

    return true;
  }

  /**
   * Salva e ottimizza l'immagine del profilo
   */
  async saveProfileImage(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ profileImageUrl: string; thumbnailUrl: string }> {
    try {
      // Valida l'immagine prima di salvarla
      await this.validateProfileImage(file);

      // Genera nomi unici per i file
      const timestamp = Date.now();
      const fileName = `profile-${userId}-${timestamp}.jpg`;
      const thumbFileName = `thumb-${userId}-${timestamp}.jpg`;

      const profilePath = path.join(this.profileImagesDir, fileName);
      const thumbPath = path.join(this.profileThumbsDir, thumbFileName);

      // Salva l'immagine principale ottimizzata (400x400)
      await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 85, 
          progressive: true 
        })
        .toFile(profilePath);

      // Crea una miniatura piccola (100x100)
      await sharp(file.buffer)
        .resize(100, 100, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 80 
        })
        .toFile(thumbPath);

      // URL relativi per accedere alle immagini
      const profileImageUrl = `/uploads/profiles/${fileName}`;
      const thumbnailUrl = `/uploads/profile-thumbs/${thumbFileName}`;

      // Aggiorna il database con il nuovo URL dell'immagine
      await this.updateUserProfileImage(userId, profileImageUrl);

      // Se l'utente aveva già un'immagine, elimina quella vecchia
      await this.deleteOldProfileImage(userId, profileImageUrl);

      return {
        profileImageUrl,
        thumbnailUrl
      };
    } catch (error) {
      console.error('Errore nel salvare l\'immagine del profilo:', error);
      throw error;
    }
  }

  /**
   * Aggiorna l'URL dell'immagine profilo nel database
   */
  private async updateUserProfileImage(userId: string, imageUrl: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl }
    });
  }

  /**
   * Elimina la vecchia immagine profilo se esiste
   */
  private async deleteOldProfileImage(userId: string, newImageUrl: string): Promise<void> {
    try {
      // Recupera l'utente per vedere se aveva già un'immagine
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { profileImage: true }
      });

      if (user?.profileImage && user.profileImage !== newImageUrl) {
        // Estrai il nome del file dall'URL
        const oldFileName = path.basename(user.profileImage);
        const oldProfilePath = path.join(this.profileImagesDir, oldFileName);
        
        // Calcola il nome della miniatura
        const oldThumbName = oldFileName.replace('profile-', 'thumb-');
        const oldThumbPath = path.join(this.profileThumbsDir, oldThumbName);

        // Elimina i file vecchi
        try {
          await fs.unlink(oldProfilePath);
          await fs.unlink(oldThumbPath);
        } catch (err) {
          console.error('Errore eliminazione vecchia immagine:', err);
        }
      }
    } catch (error) {
      console.error('Errore durante eliminazione vecchia immagine:', error);
    }
  }

  /**
   * Recupera l'URL dell'immagine profilo di un utente
   */
  async getUserProfileImage(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true }
    });

    return user?.profileImage || null;
  }

  /**
   * Rimuove l'immagine profilo di un utente
   */
  async removeProfileImage(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { profileImage: true }
      });

      if (user?.profileImage) {
        // Estrai il nome del file dall'URL
        const fileName = path.basename(user.profileImage);
        const profilePath = path.join(this.profileImagesDir, fileName);
        
        // Calcola il nome della miniatura
        const thumbName = fileName.replace('profile-', 'thumb-');
        const thumbPath = path.join(this.profileThumbsDir, thumbName);

        // Elimina i file
        try {
          await fs.unlink(profilePath);
          await fs.unlink(thumbPath);
        } catch (err) {
          console.error('Errore eliminazione immagine:', err);
        }

        // Aggiorna il database
        await prisma.user.update({
          where: { id: userId },
          data: { profileImage: null }
        });
      }
    } catch (error) {
      console.error('Errore rimozione immagine profilo:', error);
      throw error;
    }
  }

  /**
   * Genera un placeholder con le iniziali dell'utente (per quando non c'è foto)
   */
  getInitialsPlaceholder(firstName: string, lastName: string): string {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials;
  }
}

// Esporta un'istanza singola del servizio
export const profileImageService = new ProfileImageService();
