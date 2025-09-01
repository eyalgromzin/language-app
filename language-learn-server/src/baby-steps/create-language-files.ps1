# PowerShell script to create language files for baby-steps
# This script helps create the basic structure for new language folders

param(
    [string]$LanguageCode = "fr",
    [string]$LanguageName = "Français",
    [string]$LanguageNativeName = "Français"
)

Write-Host "Creating language files for $LanguageName ($LanguageCode)..." -ForegroundColor Green

# List of all lesson files to create
$lessonFiles = @(
    "01_essentials",
    "02_introductions", 
    "03_core_verbs_pronouns",
    "04_numbers_time_basics",
    "05_getting_around",
    "06_food_drink_basics",
    "07_shopping_money",
    "08_travel_hotel",
    "09_emergencies_health",
    "10_daily_routines",
    "11_family_people",
    "12_weather_smalltalk",
    "13_work_study",
    "14_plans_invitations",
    "15_requests_help",
    "16_phone_internet",
    "17_restaurant",
    "18_transportation_details",
    "19_housing_utilities",
    "20_connectors_advanced",
    "21_technology_basics",
    "22_weather_and_nature",
    "23_shopping_and_money",
    "24_family_and_relationships",
    "25_work_and_profession",
    "26_health_and_medical",
    "27_education_and_learning",
    "28_sports_and_exercise",
    "29_travel_and_transportation",
    "30_hobbies_and_entertainment",
    "31_emotions_and_feelings",
    "32_time_and_dates",
    "33_numbers_and_quantities",
    "34_colors_and_appearance",
    "35_food_and_drinks",
    "36_clothing_and_fashion",
    "37_home_and_furniture",
    "38_animals_and_pets",
    "39_communication_and_language",
    "40_advanced_phrases"
)

# Create the language folder if it doesn't exist
$languageFolder = "./$LanguageCode"
if (!(Test-Path $languageFolder)) {
    New-Item -ItemType Directory -Path $languageFolder -Force
    Write-Host "Created folder: $languageFolder" -ForegroundColor Yellow
}

# Create a basic template for each lesson file
foreach ($lesson in $lessonFiles) {
    $filePath = "$languageFolder/$lesson.json"
    
    if (!(Test-Path $filePath)) {
        $content = @"
{
  "id": "$lesson",
  "title": "TODO: Translate title for $lesson",
  "emoji": "📝",
  "language": "$LanguageNativeName",
  "items": [
    {
      "id": "${lesson}_placeholder",
      "type": "word",
      "text": "TODO: Translate this content",
      "practiceType": "chooseTranslation"
    }
  ]
}
"@
        
        Set-Content -Path $filePath -Value $content -Encoding UTF8
        Write-Host "Created: $filePath" -ForegroundColor Cyan
    } else {
        Write-Host "Skipped: $filePath (already exists)" -ForegroundColor Gray
    }
}

Write-Host "`nLanguage files created for $LanguageName!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Translate the content in each JSON file" -ForegroundColor White
Write-Host "2. Update the titles and emojis appropriately" -ForegroundColor White
Write-Host "3. Add all the lesson items with proper translations" -ForegroundColor White
Write-Host "4. Update the index.json file in the language folder" -ForegroundColor White
