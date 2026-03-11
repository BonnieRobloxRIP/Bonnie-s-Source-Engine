execute as @s[tag=!vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 15
execute as @s[tag=vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 30
execute as @s[tag=mega_vip] at @s run scoreboard players add @s coins_storage 45
execute as @s[tag=!vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§e§l+15 Coins"}]}
execute as @s[tag=vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§6§l+30 Coins"}]}
execute as @s[tag=mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§9§l+45 Coins"}]}