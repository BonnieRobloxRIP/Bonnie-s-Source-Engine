execute as @s[tag=!vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 10
execute as @s[tag=vip, tag=!mega_vip] at @s run scoreboard players add @s coins_storage 20
execute as @s[tag=mega_vip] at @s run scoreboard players add @s coins_storage 30
execute as @s[tag=!vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§e§l+10 Coins"}]}
execute as @s[tag=vip, tag=!mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§6§l+20 Coins"}]}
execute as @s[tag=mega_vip] at @s run tellraw @s {"rawtext":[{"text":"§9§l+30 Coins"}]}