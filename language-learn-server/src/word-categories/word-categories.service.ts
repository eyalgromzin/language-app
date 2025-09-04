import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WordCategoriesService {
  async getWordCategories(): Promise<any> {
    try {
      // Read the index.json file directly which contains the categories structure
      const indexPath = path.join(__dirname, '..', '..', 'data', 'wordCategories', 'index.json');
      const fileContent = fs.readFileSync(indexPath, 'utf8');
      const categoriesData = JSON.parse(fileContent);
      
      return categoriesData;
    } catch (error) {
      console.error('Failed to load word categories:', error);
      throw new BadRequestException('Failed to load word categories');
    }
  }

  async getWordCategoryById(categoryId: string): Promise<any> {
    try {
      // Read the index.json file to get the category structure and filename
      const indexPath = path.join(__dirname, '..', '..', 'data', 'wordCategories', 'index.json');
      const fileContent = fs.readFileSync(indexPath, 'utf8');
      const categoriesData = JSON.parse(fileContent);
      
      // Find the specific category to get its filename
      const category = categoriesData.categories?.find((cat: any) => cat.id === categoryId);
      
      if (!category) {
        throw new BadRequestException(`Word category with ID '${categoryId}' not found`);
      }
      
      // Read the actual category content file
      const categoryFilePath = path.join(__dirname, '..', '..', 'data', 'wordCategories', category.filename);
      const categoryFileContent = fs.readFileSync(categoryFilePath, 'utf8');
      const categoryData = JSON.parse(categoryFileContent);
      
      return categoryData;
    } catch (error) {
      console.error(`Failed to load word category ${categoryId}:`, error);
      throw new BadRequestException(`Failed to load word category: ${error.message}`);
    }
  }
}
