<?php
    require_once 'voaclass.php';

    $voaClassInstance = new Voa();
    $voaClassInstance->fetch_last_data($_GET['idvoa']);
?>
