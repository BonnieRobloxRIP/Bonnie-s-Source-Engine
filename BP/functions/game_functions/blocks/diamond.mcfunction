execute as @s[tag=!vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 7
execute as @s[tag=vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 14
execute as @s[tag=mega_vip] at @s run scoreboard players add @s coins_storage 21
execute as @s[tag=!vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§e§l+7 Coins"}]}
execute as @s[tag=vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§6§l+14 Coins"}]}
execute as @s[tag=mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§9§l+21 Coins"}]}