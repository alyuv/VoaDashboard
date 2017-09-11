<?php
    require_once 'voaclass.php';
    $voaClassInstance = new Voa();
    $voaClassInstance->fetch_data_period($_GET['from'], $_GET['to'], $_GET['id']);
?>