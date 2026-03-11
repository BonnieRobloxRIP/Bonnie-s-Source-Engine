execute as @s[tag=!vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 50
execute as @s[tag=vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 100
execute as @s[tag=mega_vip] at @s run scoreboard players add @s coins_storage 150
execute as @s[tag=!vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§e§l+50 Coins"}]}
execute as @s[tag=vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§6§l+100 Coins"}]}
execute as @s[tag=mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§9§l+150 Coins"}]}