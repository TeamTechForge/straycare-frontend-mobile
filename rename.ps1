$dir = 'c:\StrayCare\straycare-frontend-mobile'
$mappings = [ordered]@{
    'chat.service' = 'ChatService'
    'forum.service' = 'ForumService'
    'google-auth.service' = 'GoogleAuthService'
    'rescue.service' = 'RescueService'
    'pushNotificationService' = 'PushNotificationService'
}

foreach ($key in $mappings.Keys) {
    $old = $key
    $new = $mappings[$key]
    
    if (Test-Path "$dir\services\$old.ts") {
        Rename-Item -Path "$dir\services\$old.ts" -NewName "$new.ts"
    }
    if (Test-Path "$dir\services\$old.js") {
        Rename-Item -Path "$dir\services\$old.js" -NewName "$new.js"
    }

    Get-ChildItem -Path $dir -Recurse -Include *.ts,*.tsx,*.js,*.jsx | ForEach-Object {
        $content = [System.IO.File]::ReadAllText($_.FullName)
        if ($content -match "services/$old") {
            $newContent = $content -replace "services/$old", "services/$new"
            [System.IO.File]::WriteAllText($_.FullName, $newContent)
        }
    }
}
