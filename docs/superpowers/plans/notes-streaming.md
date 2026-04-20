# Streaming Kararı

Claude tool_use akışı streaming'de karmaşık (content_block_start → delta → stop_reason).
Tool loop'u client-side'da yönetmek state yönetimi gerektirir.
Faz 2'de basit typing indicator ile yetinildi. Faz 6'da tam streaming ele alınacak.
