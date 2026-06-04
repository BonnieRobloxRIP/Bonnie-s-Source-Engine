# // Scores
scoreboard players add fan lobby 1
execute if score fan lobby matches 6.. run scoreboard players set fan lobby 0
# // Animations
# // Fans
# // right
execute if score fan lobby matches 0 run structure load "lobby/animated:EngineFan4" -11 22 35
execute if score fan lobby matches 1 run structure load "lobby/animated:EngineFan3" -11 22 35
execute if score fan lobby matches 3 run structure load "lobby/animated:EngineFan2" -11 22 35
execute if score fan lobby matches 4 run structure load "lobby/animated:EngineFan1" -11 22 35
execute if score fan lobby matches 5 run structure load "lobby/animated:EngineFan5" -11 22 35
# // left
execute if score fan lobby matches 0 run structure load "lobby/animated:EngineFan1" 5 22 35
execute if score fan lobby matches 1 run structure load "lobby/animated:EngineFan2" 5 22 35
execute if score fan lobby matches 3 run structure load "lobby/animated:EngineFan3" 5 22 35
execute if score fan lobby matches 4 run structure load "lobby/animated:EngineFan4" 5 22 35
execute if score fan lobby matches 5 run structure load "lobby/animated:EngineFan5" 5 22 35
# // = EFFECTS =
# // Fan Push
# // right
execute as @a[x=-11, y=0, z=35, dx=6, dy=27, dz=6] at @s run effect @s levitation 1 20 true
# // left
execute as @a[x=5, y=0, z=35, dx=6, dy=27, dz=6] at @s run effect @s levitation 1 20 true