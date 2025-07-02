SELECT 
  name AS table_name,
  type,
  sql AS definition
FROM 
  sqlite_master
WHERE 
  type = 'table'
ORDER BY 
  name;