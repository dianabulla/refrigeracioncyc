<?php
class CuartoFrio {
    private $pdo;
    public function __construct($pdo){ $this->pdo=$pdo; }

    public function crear(array $d): bool {
        try{
            $st=$this->pdo->prepare("INSERT INTO cuarto_frio (codigo,nombre,descripcion,activo,fecha_creacion,codigo_finca)
                                     VALUES (:codigo,:nombre,:descripcion,:activo,NOW(),:codigo_finca)");
            return $st->execute([
                ':codigo'=>$d['codigo']??null, ':nombre'=>trim($d['nombre']??''),
                ':descripcion'=>trim($d['descripcion']??''), ':activo'=>isset($d['activo'])?(int)$d['activo']:1,
                ':codigo_finca'=>$d['codigo_finca']??null
            ]);
        }catch(PDOException $e){ error_log("CuartoFrio crear: ".$e->getMessage()); return false; }
    }

    public function obtenerTodos(array $f=[]): array {
        try{
            $sql="SELECT * FROM cuarto_frio WHERE 1=1"; $p=[];
            if(!empty($f['codigo_finca'])){ $sql.=" AND codigo_finca=?"; $p[]=$f['codigo_finca']; }
            if(isset($f['activo'])){ $sql.=" AND activo=?"; $p[]=(int)$f['activo']; }
            $sql.=" ORDER BY id DESC";
            $st=$this->pdo->prepare($sql); $st->execute($p); return $st->fetchAll(PDO::FETCH_ASSOC);
        }catch(PDOException $e){ error_log("CuartoFrio obtenerTodos: ".$e->getMessage()); return []; }
    }

    public function obtenerPorId(int $id): ?array {
        try{ $st=$this->pdo->prepare("SELECT * FROM cuarto_frio WHERE id=:id"); $st->execute([':id'=>$id]); $r=$st->fetch(PDO::FETCH_ASSOC); return $r?:null; }
        catch(PDOException $e){ error_log("CuartoFrio obtenerPorId: ".$e->getMessage()); return null; }
    }

    public function obtenerPorCodigo(string $c): ?array {
        try{ $st=$this->pdo->prepare("SELECT * FROM cuarto_frio WHERE codigo=:c LIMIT 1"); $st->execute([':c'=>$c]); $r=$st->fetch(PDO::FETCH_ASSOC); return $r?:null; }
        catch(PDOException $e){ error_log("CuartoFrio obtenerPorCodigo: ".$e->getMessage()); return null; }
    }

    public function actualizar(int $id, array $d): bool {
        try{
            $fields=['codigo'=>$d['codigo']??null,'nombre'=>trim($d['nombre']??''),'descripcion'=>trim($d['descripcion']??''),'activo'=>isset($d['activo'])?(int)$d['activo']:1];
            $set=[]; foreach($fields as $k=>$v){ $set[]="$k = :$k"; }
            $sql="UPDATE cuarto_frio SET ".implode(', ',$set).", updated_at=NOW() WHERE id=:id";
            $st=$this->pdo->prepare($sql); $fields['id']=$id; return $st->execute($fields);
        }catch(PDOException $e){ error_log("CuartoFrio actualizar: ".$e->getMessage()); return false; }
    }

    public function eliminar(int $id): bool {
        try{ $st=$this->pdo->prepare("DELETE FROM cuarto_frio WHERE id=:id"); return $st->execute([':id'=>$id]); }
        catch(PDOException $e){ error_log("CuartoFrio eliminar: ".$e->getMessage()); return false; }
    }
}
